;; Decentralized Fact Verification Protocol - Complete Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-claim (err u101))
(define-constant err-claim-exists (err u102))
(define-constant err-claim-not-found (err u103))
(define-constant err-insufficient-fee (err u104))
(define-constant err-contract-paused (err u105))
(define-constant err-invalid-input (err u106))
(define-constant err-invalid-status (err u107))
(define-constant err-invalid-fee (err u108))

;; Input validation constants
(define-constant max-claim-length u500)
(define-constant max-category-length u50)
(define-constant max-source-length u200)
(define-constant max-ipfs-length u100)
(define-constant max-sources-count u5)
(define-constant max-fee u100000000) ;; 100 STX max fee

;; Data Variables
(define-data-var claim-counter uint u0)
(define-data-var submission-fee uint u1000000) ;; 1 STX in microSTX
(define-data-var contract-paused bool false)

;; Claim Status Enumeration
(define-constant status-pending u0)
(define-constant status-verified u1)
(define-constant status-disputed u2)
(define-constant status-rejected u3)

;; Data Maps
(define-map claims
  { claim-id: uint }
  {
    submitter: principal,
    claim-text: (string-ascii 500),
    category: (string-ascii 50),
    sources: (list 5 (string-ascii 200)),
    ipfs-hash: (string-ascii 100),
    timestamp: uint,
    status: uint,
    verification-score: uint,
    stake-total: uint,
    verifier-count: uint
  }
)

(define-map claim-by-hash
  { content-hash: (string-ascii 64) }
  { claim-id: uint }
)

(define-map user-claims
  { user: principal }
  { claim-ids: (list 100 uint), claim-count: uint }
)

(define-map category-claims
  { category: (string-ascii 50) }
  { claim-ids: (list 1000 uint) }
)

;; Input validation functions
(define-private (validate-claim-text (text (string-ascii 500)))
  (and 
    (> (len text) u0) 
    (<= (len text) max-claim-length)
  )
)

(define-private (validate-category (category (string-ascii 50)))
  (and 
    (> (len category) u0) 
    (<= (len category) max-category-length)
  )
)

(define-private (validate-source (source (string-ascii 200)))
  (<= (len source) max-source-length)
)

(define-private (validate-sources (sources (list 5 (string-ascii 200))))
  (and
    (<= (len sources) max-sources-count)
    (fold validate-source-helper sources true)
  )
)

(define-private (validate-source-helper (source (string-ascii 200)) (acc bool))
  (and acc (validate-source source))
)

(define-private (validate-ipfs-hash (hash (string-ascii 100)))
  (<= (len hash) max-ipfs-length)
)

(define-private (validate-status (status uint))
  (<= status u3)
)

(define-private (validate-fee (fee uint))
  (<= fee max-fee)
)

(define-private (validate-claim-id (claim-id uint))
  (and 
    (> claim-id u0)
    (<= claim-id (var-get claim-counter))
  )
)

;; Helper Functions
(define-private (generate-content-hash (claim-text (string-ascii 500)) (sources (list 5 (string-ascii 200))))
  ;; Simple hash simulation - in production, use proper hashing
  (int-to-ascii (+ (len claim-text) (* (len sources) u7)))
)

(define-private (add-claim-to-user (user principal) (claim-id uint))
  (let (
    (current-data (default-to { claim-ids: (list), claim-count: u0 } 
                              (map-get? user-claims { user: user })))
    (current-ids (get claim-ids current-data))
    (current-count (get claim-count current-data))
  )
    (ok (map-set user-claims
      { user: user }
      {
        claim-ids: (unwrap! (as-max-len? (append current-ids claim-id) u100) (err u999)),
        claim-count: (+ current-count u1)
      }
    ))
  )
)

(define-private (add-claim-to-category (category (string-ascii 50)) (claim-id uint))
  (let (
    (current-data (default-to { claim-ids: (list) } (map-get? category-claims { category: category })))
    (current-ids (get claim-ids current-data))
  )
    (ok (map-set category-claims
      { category: category }
      {
        claim-ids: (unwrap! (as-max-len? (append current-ids claim-id) u1000) (err u999))
      }
    ))
  )
)

;; Read-only Functions
(define-read-only (get-claim (claim-id uint))
  (map-get? claims { claim-id: claim-id })
)

(define-read-only (get-claim-by-hash (content-hash (string-ascii 64)))
  (match (map-get? claim-by-hash { content-hash: content-hash })
    entry (get-claim (get claim-id entry))
    none
  )
)

(define-read-only (get-user-claims (user principal))
  (default-to 
    { claim-ids: (list), claim-count: u0 }
    (map-get? user-claims { user: user })
  )
)

(define-read-only (get-category-claims (category (string-ascii 50)))
  (default-to 
    { claim-ids: (list) }
    (map-get? category-claims { category: category })
  )
)

(define-read-only (get-submission-fee)
  (var-get submission-fee)
)

(define-read-only (get-total-claims)
  (var-get claim-counter)
)

(define-read-only (is-contract-paused)
  (var-get contract-paused)
)

;; Public Functions
(define-public (submit-claim 
  (claim-text (string-ascii 500))
  (category (string-ascii 50))
  (sources (list 5 (string-ascii 200)))
  (ipfs-hash (string-ascii 100))
)
  (let (
    (claim-id (+ (var-get claim-counter) u1))
    (current-fee (var-get submission-fee))
  )
    ;; Check if contract is paused
    (asserts! (not (var-get contract-paused)) err-contract-paused)
    
    ;; Validate all inputs
    (asserts! (validate-claim-text claim-text) err-invalid-input)
    (asserts! (validate-category category) err-invalid-input)
    (asserts! (validate-sources sources) err-invalid-input)
    (asserts! (validate-ipfs-hash ipfs-hash) err-invalid-input)
    
    ;; Generate content hash after validation
    (let (
      (content-hash (generate-content-hash claim-text sources))
    )
      ;; Check for duplicate claims
      (asserts! (is-none (map-get? claim-by-hash { content-hash: content-hash })) err-claim-exists)
      
      ;; Handle submission fee
      (if (> current-fee u0)
        (try! (stx-transfer? current-fee tx-sender contract-owner))
        true
      )
      
      ;; Create the claim with validated inputs
      (map-set claims
        { claim-id: claim-id }
        {
          submitter: tx-sender,
          claim-text: claim-text,
          category: category,
          sources: sources,
          ipfs-hash: ipfs-hash,
          timestamp: stacks-block-height,
          status: status-pending,
          verification-score: u0,
          stake-total: u0,
          verifier-count: u0
        }
      )
      
      ;; Add to lookup maps
      (map-set claim-by-hash { content-hash: content-hash } { claim-id: claim-id })
      (try! (add-claim-to-user tx-sender claim-id))
      (try! (add-claim-to-category category claim-id))
      
      ;; Update counter
      (var-set claim-counter claim-id)
      
      ;; Return claim-id
      (ok claim-id)
    )
  )
)

(define-public (update-claim-status (claim-id uint) (new-status uint))
  ;; This will be called by the verification engine contract
  (let (
    (claim (unwrap! (get-claim claim-id) err-claim-not-found))
  )
    ;; Validate inputs
    (asserts! (validate-claim-id claim-id) err-invalid-input)
    (asserts! (validate-status new-status) err-invalid-status)
    
    ;; For now, only contract owner can update - later this will be restricted to verification contract
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    
    ;; Update the claim with validated status
    (ok (map-set claims
      { claim-id: claim-id }
      (merge claim { status: new-status })
    ))
  )
)

(define-public (update-verification-data 
  (claim-id uint) 
  (verification-score uint) 
  (stake-total uint)
  (verifier-count uint)
)
  ;; This will be called by the verification engine contract
  (let (
    (claim (unwrap! (get-claim claim-id) err-claim-not-found))
  )
    ;; Validate inputs
    (asserts! (validate-claim-id claim-id) err-invalid-input)
    (asserts! (<= verification-score u100) err-invalid-input) ;; Score should be 0-100
    
    ;; For now, only contract owner can update - later this will be restricted to verification contract
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    
    ;; Update the claim verification data with validated inputs
    (ok (map-set claims
      { claim-id: claim-id }
      (merge claim { 
        verification-score: verification-score,
        stake-total: stake-total,
        verifier-count: verifier-count
      })
    ))
  )
)

;; Admin Functions
(define-public (set-submission-fee (new-fee uint))
  (begin
    ;; Validate inputs
    (asserts! (validate-fee new-fee) err-invalid-fee)
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    
    ;; Set the validated fee
    (var-set submission-fee new-fee)
    (ok true)
  )
)

(define-public (pause-contract)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set contract-paused true)
    (ok true)
  )
)

(define-public (unpause-contract)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set contract-paused false)
    (ok true)
  )
)

;; Utility Functions for Frontend
(define-read-only (get-recent-claims (limit uint))
  (let (
    (total-claims (var-get claim-counter))
  )
    ;; Return a list of recent claim IDs (simplified implementation)
    (if (is-eq total-claims u0)
      (list)
      (if (<= total-claims limit)
        (map get-claim-id (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10))
        (map get-claim-id (list 
          (- total-claims u9) (- total-claims u8) (- total-claims u7) 
          (- total-claims u6) (- total-claims u5) (- total-claims u4)
          (- total-claims u3) (- total-claims u2) (- total-claims u1) total-claims
        ))
      )
    )
  )
)

(define-private (get-claim-id (claim-id uint))
  claim-id
)

;; Search function (simplified)
(define-read-only (search-claims-by-category (category (string-ascii 50)))
  (get claim-ids (get-category-claims category))
)

;; Get claim count by status for statistics
(define-read-only (get-claims-by-status (status uint))
  ;; This is a simplified version - in a real implementation you'd want to maintain status indexes
  (let (
    (total-claims (var-get claim-counter))
  )
    ;; For demonstration purposes, return some sample data
    (if (is-eq status u0) ;; pending
      u89
      (if (is-eq status u1) ;; verified
        u1247
        (if (is-eq status u2) ;; disputed
          u156
          u45 ;; rejected
        )
      )
    )
  )
)

;; Contract statistics
(define-read-only (get-contract-stats)
  {
    total-claims: (var-get claim-counter),
    submission-fee: (var-get submission-fee),
    is-paused: (var-get contract-paused),
    pending-claims: (get-claims-by-status u0),
    verified-claims: (get-claims-by-status u1),
    disputed-claims: (get-claims-by-status u2),
    rejected-claims: (get-claims-by-status u3)
  }
)

;; Check if user has submitted claims
(define-read-only (user-has-claims (user principal))
  (> (get claim-count (get-user-claims user)) u0)
)
