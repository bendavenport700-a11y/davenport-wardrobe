export default function FAQPage() {
  return (
    <main
      style={{
        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
        background: "radial-gradient(circle at top, #0f0f10 0%, #070708 60%)",
        color: "#eaeaea",
        minHeight: "100vh",
        padding: "120px 24px",
      }}
    >
      <style>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        .title {
          font-size: 3.2rem;
          letter-spacing: -0.03em;
          margin-bottom: 24px;
          color: #ffffff;
        }
        .subtitle {
          font-size: 1.1rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          margin-bottom: 64px;
          max-width: 760px;
        }
        .faqItem {
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 20px;
          background: rgba(255,255,255,0.03);
        }
        .faqQuestion {
          font-size: 1.35rem;
          margin-bottom: 10px;
          color: rgba(255,255,255,0.92);
        }
        .faqAnswer {
          font-size: 1.05rem;
          line-height: 1.8;
          color: rgba(255,255,255,0.72);
        }
      `}</style>

      <div className="container">
        <h1 className="title">Frequently Asked Questions</h1>
        <p className="subtitle">
          Everything you need to know about Davenport Wardrobe, how it works,
          and why it’s built differently.
        </p>

        {/* FAQ ITEMS */}

        <div className="faqItem">
          <h3 className="faqQuestion">What is Davenport Wardrobe?</h3>
          <p className="faqAnswer">
            Davenport Wardrobe is a premium clothing access platform designed
            for young men. Instead of buying clothes you may outgrow, stop
            wearing, or regret purchasing, you receive curated wardrobes
            delivered directly to your door.
          </p>
        </div>

        <div className="faqItem">
          <h3 className="faqQuestion">Is this renting?</h3>
          <p className="faqAnswer">
            Not exactly. Davenport Wardrobe focuses on access rather than
            ownership. You wear clothing as part of a rotating wardrobe and
            decide whether to return it, continue using it, or purchase it as
            pricing adjusts over time.
          </p>
        </div>

        <div className="faqItem">
          <h3 className="faqQuestion">How does the pricing work?</h3>
          <p className="faqAnswer">
            Every garment has a lifecycle. As pieces are worn and circulate
            through the system, their cost becomes more accessible. This
            rewards reuse while keeping high-quality clothing in rotation
            longer.
          </p>
        </div>

        <div className="faqItem">
          <h3 className="faqQuestion">How does AI fit into this?</h3>
          <p className="faqAnswer">
            Davenport Wardrobe uses intelligent styling tools to recommend
            pieces based on your fit, preferences, and lifestyle. You always
            have the ability to review, edit, and adjust selections before
            anything ships.
          </p>
        </div>

        <div className="faqItem">
          <h3 className="faqQuestion">What happens if something doesn’t fit?</h3>
          <p className="faqAnswer">
            Fit flexibility is core to the platform. If your size changes or
            something doesn’t work, your wardrobe can be adjusted. This is
            especially useful for students and young adults whose bodies and
            needs evolve over time.
          </p>
        </div>

        <div className="faqItem">
          <h3 className="faqQuestion">Do I have to store clothes between seasons?</h3>
          <p className="faqAnswer">
            No. Davenport Wardrobe eliminates the need to pack, store, or haul
            clothing between dorms, apartments, or seasons. Your wardrobe
            changes when your lifestyle changes.
          </p>
        </div>

        <div className="faqItem">
          <h3 className="faqQuestion">Is this sustainable?</h3>
          <p className="faqAnswer">
            Yes. By extending the life of each garment and reducing the demand
            for constant new production, Davenport Wardrobe helps lower textile
            waste and overproduction while maintaining quality and style.
          </p>
        </div>

        <div className="faqItem">
          <h3 className="faqQuestion">Who is this for?</h3>
          <p className="faqAnswer">
            Davenport Wardrobe is built for college students, young
            professionals, and anyone who values flexibility, efficiency, and
            well-designed clothing without unnecessary ownership.
          </p>
        </div>

        <div className="faqItem">
          <h3 className="faqQuestion">When are you launching?</h3>
          <p className="faqAnswer">
            We’re currently building and refining the platform. You can join
            the waitlist on the homepage for early access and updates.
          </p>
        </div>
      </div>
    </main>
  );
}
