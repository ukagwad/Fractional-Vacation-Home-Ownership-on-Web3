(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-TOTAL-TOKENS u101)
(define-constant ERR-INVALID-LEGAL-HASH u102)
(define-constant ERR-INVALID-LOCATION u103)
(define-constant ERR-INVALID-DESCRIPTION u104)
(define-constant ERR-INVALID-VALUE u105)
(define-constant ERR-PROPERTY-ALREADY-EXISTS u106)
(define-constant ERR-PROPERTY-NOT-FOUND u107)
(define-constant ERR-INVALID-TIMESTAMP u108)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u109)
(define-constant ERR-INVALID-CURRENCY u110)
(define-constant ERR-INVALID-STATUS u111)
(define-constant ERR-PROPERTY-UPDATE-NOT-ALLOWED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-MAX-PROPERTIES-EXCEEDED u114)
(define-constant ERR-INVALID-PROPERTY-TYPE u115)
(define-constant ERR-INVALID-CAPACITY u116)
(define-constant ERR-INVALID-AMENITIES u117)
(define-constant ERR-INVALID-OWNER u118)

(define-data-var next-property-id uint u0)
(define-data-var max-properties uint u1000)
(define-data-var registration-fee uint u1000)
(define-data-var authority-contract (optional principal) none)

(define-map properties
  uint
  {
    owner: principal,
    location: (string-utf8 100),
    description: (string-utf8 500),
    legal-hash: (buff 32),
    total-tokens: uint,
    timestamp: uint,
    value: uint,
    currency: (string-utf8 20),
    status: bool,
    property-type: (string-utf8 50),
    capacity: uint,
    amenities: (string-utf8 200)
  }
)

(define-map properties-by-location
  (string-utf8 100)
  uint)

(define-map property-updates
  uint
  {
    update-location: (string-utf8 100),
    update-description: (string-utf8 500),
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-property (id uint))
  (map-get? properties id)
)

(define-read-only (get-property-updates (id uint))
  (map-get? property-updates id)
)

(define-read-only (is-property-registered (location (string-utf8 100)))
  (is-some (map-get? properties-by-location location))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (and (> (len loc) u0) (<= (len loc) u100))
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-description (desc (string-utf8 500)))
  (if (and (> (len desc) u0) (<= (len desc) u500))
      (ok true)
      (err ERR-INVALID-DESCRIPTION))
)

(define-private (validate-legal-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-LEGAL-HASH))
)

(define-private (validate-total-tokens (tokens uint))
  (if (> tokens u0)
      (ok true)
      (err ERR-INVALID-TOTAL-TOKENS))
)

(define-private (validate-value (val uint))
  (if (> val u0)
      (ok true)
      (err ERR-INVALID-VALUE))
)

(define-private (validate-currency (cur (string-utf8 20)))
  (if (or (is-eq cur "STX") (is-eq cur "USD") (is-eq cur "BTC"))
      (ok true)
      (err ERR-INVALID-CURRENCY))
)

(define-private (validate-property-type (ptype (string-utf8 50)))
  (if (or (is-eq ptype "beach") (is-eq ptype "mountain") (is-eq ptype "urban"))
      (ok true)
      (err ERR-INVALID-PROPERTY-TYPE))
)

(define-private (validate-capacity (cap uint))
  (if (and (> cap u0) (<= cap u20))
      (ok true)
      (err ERR-INVALID-CAPACITY))
)

(define-private (validate-amenities (amen (string-utf8 200)))
  (if (<= (len amen) u200)
      (ok true)
      (err ERR-INVALID-AMENITIES))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-owner (own principal))
  (if (not (is-eq own tx-sender))
      (ok true)
      (err ERR-INVALID-OWNER))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-properties (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-MAX-PROPERTIES-EXCEEDED))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-properties new-max)
    (ok true)
  )
)

(define-public (set-registration-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set registration-fee new-fee)
    (ok true)
  )
)

(define-public (register-property
  (location (string-utf8 100))
  (description (string-utf8 500))
  (legal-hash (buff 32))
  (total-tokens uint)
  (value uint)
  (currency (string-utf8 20))
  (property-type (string-utf8 50))
  (capacity uint)
  (amenities (string-utf8 200))
)
  (let (
        (next-id (var-get next-property-id))
        (current-max (var-get max-properties))
        (authority (var-get authority-contract))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-PROPERTIES-EXCEEDED))
    (try! (validate-location location))
    (try! (validate-description description))
    (try! (validate-legal-hash legal-hash))
    (try! (validate-total-tokens total-tokens))
    (try! (validate-value value))
    (try! (validate-currency currency))
    (try! (validate-property-type property-type))
    (try! (validate-capacity capacity))
    (try! (validate-amenities amenities))
    (asserts! (is-none (map-get? properties-by-location location)) (err ERR-PROPERTY-ALREADY-EXISTS))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get registration-fee) tx-sender authority-recipient))
    )
    (map-set properties next-id
      {
        owner: tx-sender,
        location: location,
        description: description,
        legal-hash: legal-hash,
        total-tokens: total-tokens,
        timestamp: block-height,
        value: value,
        currency: currency,
        status: true,
        property-type: property-type,
        capacity: capacity,
        amenities: amenities
      }
    )
    (map-set properties-by-location location next-id)
    (var-set next-property-id (+ next-id u1))
    (print { event: "property-registered", id: next-id })
    (ok next-id)
  )
)

(define-public (update-property
  (property-id uint)
  (update-location (string-utf8 100))
  (update-description (string-utf8 500))
)
  (let ((property (map-get? properties property-id)))
    (match property
      p
        (begin
          (asserts! (is-eq (get owner p) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-location update-location))
          (try! (validate-description update-description))
          (let ((existing (map-get? properties-by-location update-location)))
            (match existing
              existing-id
                (asserts! (is-eq existing-id property-id) (err ERR-PROPERTY-ALREADY-EXISTS))
              (begin true)
            )
          )
          (let ((old-location (get location p)))
            (if (is-eq old-location update-location)
                (ok true)
                (begin
                  (map-delete properties-by-location old-location)
                  (map-set properties-by-location update-location property-id)
                  (ok true)
                )
            )
          )
          (map-set properties property-id
            {
              owner: (get owner p),
              location: update-location,
              description: update-description,
              legal-hash: (get legal-hash p),
              total-tokens: (get total-tokens p),
              timestamp: block-height,
              value: (get value p),
              currency: (get currency p),
              status: (get status p),
              property-type: (get property-type p),
              capacity: (get capacity p),
              amenities: (get amenities p)
            }
          )
          (map-set property-updates property-id
            {
              update-location: update-location,
              update-description: update-description,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "property-updated", id: property-id })
          (ok true)
        )
      (err ERR-PROPERTY-NOT-FOUND)
    )
  )
)

(define-public (get-property-count)
  (ok (var-get next-property-id))
)

(define-public (verify-property (property-id uint))
  (ok (is-some (map-get? properties property-id)))
)