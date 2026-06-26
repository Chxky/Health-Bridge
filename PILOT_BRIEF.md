# HealthBridge MedTrack — Pilot Brief

## One-Page Summary for the Ministry of Health and Child Care, Zimbabwe

---

### The Problem

Zimbabwe's public health supply chain faces critical challenges:
- **No real-time visibility** into medicine stock levels at facility level
- **Manual, paper-based** receipt processes at hospital pharmacies
- **Stockouts** of essential medicines due to delayed reordering
- **No accountability** for consignments dispatched from central warehouse
- **Limited compliance** with electronic Government Procurement (e-GP) requirements

### The Solution: HealthBridge MedTrack

A **mobile-first traceability and stock management system** connecting NatPharm, hospital pharmacies, and Ministry officials on a single platform.

| Component | Users | Key Features |
|-----------|-------|-------------|
| **Flutter Mobile App** | Hospital pharmacy staff | QR scan receipt, stock view, offline mode, manual adjustments |
| **React Dashboard** | NatPharm, Ministry officials | National stock map, reorder engine, e-GP compliance, supplier performance |
| **Cloud Backend** | System-wide | Firestore DB, Cloud Functions, push notifications, role-based access |

### Pilot Scope

**Duration:** 8 Weeks
**Locations:** 5 facilities (2 central hospitals, 2 district hospitals, 1 clinic)
**Medicines:** Top 20 essential medicines by volume (tracked by the Essential Medicines List of Zimbabwe)

### Key Metrics

| Metric | Target |
|--------|--------|
| Consignment scan rate | >95% within 24h of arrival |
| Stock data accuracy | >98% reconciliation |
| Reorder alert timeliness | <1h from threshold breach |
| Offline sync success | >99% (retry mechanism) |
| User adoption | >90% active weekly users |

### Expected Outcomes

1. **Stockout Reduction**: 40-60% reduction in essential medicine stockouts through early warning system
2. **Supply Chain Visibility**: Real-time dashboard showing stock levels across all pilot facilities
3. **Accountability**: Every consignment tracked from dispatch to receipt with timestamp and GPS
4. **e-GP Compliance**: Automated tracking of receipt scanning compliance per facility
5. **Data-Driven Procurement**: AI-powered reorder suggestions based on consumption patterns

### Implementation Roadmap

```
Week 1-2:  Firebase setup, schema creation, QR generation
Week 3-4:  Pharmacy app (receipt confirmation, stock view, adjustments)
Week 5-6:  Admin dashboard (stock map, alerts, compliance tracker)
Week 7-8:  AI reorder engine, notifications, pilot preparation
```

### Resource Requirements

**Ministry / NatPharm:**
- Project sponsor (1)
- IT liaison (1) — Firebase access, device provisioning
- Procurement officer (1) — Reorder threshold configuration

**Pilot Facilities:**
- Pharmacy lead (1 per facility)
- Pharmacy staff (2-3 per facility)
- Android/iOS device with camera

**Technical Support:**
- Developer (1 full-time) — Deployment, troubleshooting, training
- Server: Firebase Blaze plan (cost: ~$50-100/month for pilot)

### Risk Assessment

| Risk | Likelihood | Mitigation |
|------|:----------:|------------|
| Network connectivity issues | Medium | Offline-first design, sqflite local cache, FIFO sync |
| Device compatibility | Low | Flutter supports Android 5+ and iOS 12+ |
| User resistance to new system | Medium | Hands-on training, simple UI, QR eliminates manual data entry |
| Data privacy concerns | Low | Role-based access, Firestore rules, no patient data stored |
| Power outages | Medium | Offline mode works without power; sync when restored |

### Success Criteria for Full Rollout

1. All 5 pilot facilities achieve >90% scan compliance for 4 consecutive weeks
2. Stockout rate for monitored medicines decreases by >40%
3. Users rate system usability >4/5 in satisfaction survey
4. Reorder engine accuracy validated against manual ordering (within 20%)
5. System handles 1000+ daily transactions without performance degradation

### Contact

**Project Lead:** [Name], [Title]
**Technical Lead:** [Name], [Title]
**NatPharm Liaison:** [Name], [Title]

---

*HealthBridge MedTrack is developed in support of Zimbabwe's National Health Strategy and the e-Government Procurement initiative.*
