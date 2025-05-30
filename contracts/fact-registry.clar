;; Decentralized Fact Verification Protocol - Validation System
;; Commit 3: Add comprehensive input validation and duplicate prevention

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-claim (err u101))
(define-constant err-claim-exists (err u102))
(define-constant err-claim-not-found (err u103))
(define-constant err-invalid-input (err u106))

;; Input validation constants
(define-constant max-claim-length u500)
(define-constant max-category-length u50)
(define-constant max-source-length u200)
(define-constant max-ipfs-length u100)
(define-constant max-sources-count u5)

;; Data Variables
(define-data-var claim-counter uint u0)

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
    status: uint
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

(define-read-only (get-total-claims)
  (var-get claim-counter)
)

;; Enhanced claim submission with full validation
(define-public (submit-claim 
  (claim-text (string-ascii 500))
  (category (string-ascii 50))
  (sources (list 5 (string-ascii 200)))
  (ipfs-hash (string-ascii 100))
)
  (let (
    (claim-id (+ (var-get claim-counter) u1))
  )
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
          status: status-pending
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
