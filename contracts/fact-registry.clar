;; Decentralized Fact Verification Protocol - Basic Structure
;; Commit 1: Basic contract structure with constants and data maps

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-claim-not-found (err u103))

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
    timestamp: uint,
    status: uint
  }
)

;; Read-only Functions
(define-read-only (get-claim (claim-id uint))
  (map-get? claims { claim-id: claim-id })
)

(define-read-only (get-total-claims)
  (var-get claim-counter)
)

;; Basic claim submission function
(define-public (submit-basic-claim 
  (claim-text (string-ascii 500))
  (category (string-ascii 50))
)
  (let (
    (claim-id (+ (var-get claim-counter) u1))
  )
    ;; Create the claim
    (map-set claims
      { claim-id: claim-id }
      {
        submitter: tx-sender,
        claim-text: claim-text,
        category: category,
        timestamp: stacks-block-height,
        status: status-pending
      }
    )
    
    ;; Update counter
    (var-set claim-counter claim-id)
    
    ;; Return claim-id
    (ok claim-id)
  )
)
