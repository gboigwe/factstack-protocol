;; Decentralized Fact Verification Protocol - Add Sources Support
;; Commit 2: Add source tracking and basic input validation

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-claim (err u101))
(define-constant err-claim-not-found (err u103))

;; Data Variables
(define-data-var claim-counter uint u0)

;; Claim Status Enumeration
(define-constant status-pending u0)
(define-constant status-verified u1)
(define-constant status-disputed u2)
(define-constant status-rejected u3)

;; Enhanced Data Maps
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

(define-map user-claims
  { user: principal }
  { claim-ids: (list 100 uint), claim-count: uint }
)

;; Helper Functions
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

;; Read-only Functions
(define-read-only (get-claim (claim-id uint))
  (map-get? claims { claim-id: claim-id })
)

(define-read-only (get-user-claims (user principal))
  (default-to 
    { claim-ids: (list), claim-count: u0 }
    (map-get? user-claims { user: user })
  )
)

(define-read-only (get-total-claims)
  (var-get claim-counter)
)

;; Enhanced claim submission with sources
(define-public (submit-claim 
  (claim-text (string-ascii 500))
  (category (string-ascii 50))
  (sources (list 5 (string-ascii 200)))
  (ipfs-hash (string-ascii 100))
)
  (let (
    (claim-id (+ (var-get claim-counter) u1))
  )
    ;; Basic validation
    (asserts! (> (len claim-text) u0) err-invalid-claim)
    (asserts! (> (len category) u0) err-invalid-claim)
    
    ;; Create the claim
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
    
    ;; Add to user tracking
    (try! (add-claim-to-user tx-sender claim-id))
    
    ;; Update counter
    (var-set claim-counter claim-id)
    
    ;; Return claim-id
    (ok claim-id)
  )
)
