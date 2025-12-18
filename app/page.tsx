export default function Home() {
  return (
    <main style={{
      fontFamily: "sans-serif",
      padding: "60px 20px",
      maxWidth: "900px",
      margin: "0 auto"
    }}>
      
      {/* HERO */}
      <section style={{ textAlign: "center", marginBottom: "80px" }}>
        <h1 style={{ fontSize: "3.5rem", marginBottom: "20px" }}>
          Davenport Wardrobe
        </h1>
        <p style={{ fontSize: "1.3rem", maxWidth: "600px", margin: "0 auto" }}>
          A shared wardrobe for college students.
          Rent, try, or buy clothing — with prices that drop as items age.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ marginBottom: "80px" }}>
        <h2>How it works</h2>
        <ol style={{ fontSize: "1.1rem", lineHeight: "1.8" }}>
          <li>Choose clothes from our rotating wardrobe</li>
          <li>Wear them for a week, a month, or longer</li>
          <li>Send them back or buy them at a reduced price</li>
        </ol>
      </section>

      {/* WHY DIFFERENT */}
      <section style={{ marginBottom: "80px" }}>
        <h2>Why Davenport?</h2>
        <p style={{ fontSize: "1.1rem", maxWidth: "700px" }}>
          Every item has an age. The more it’s worn, the cheaper it becomes.
          New clothes stay premium. Older favorites become affordable.
          Sustainable, flexible, and fair.
        </p>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ marginBottom: "80px" }}>
        <h2>Who it’s for</h2>
        <ul style={{ fontSize: "1.1rem", lineHeight: "1.8" }}>
          <li>College students who don’t want to buy seasonal clothes</li>
          <li>People who want to try outfits before committing</li>
          <li>Growing teens who outgrow clothes quickly</li>
          <li>Special occasions — weddings, formals, interviews</li>
        </ul>
      </section>

      {/* WAITLIST */}
      <section style={{
        padding: "40px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        textAlign: "center"
      }}>
        <h2>Join the waitlist</h2>
        <p>Be first when Davenport Wardrobe launches.</p>

        {/* TEMP WAITLIST FORM */}
        <form
          action="https://formspree.io/f/XXXXXXXX"
          method="POST"
          style={{ marginTop: "20px" }}
        >
          <input
            type="email"
            name="email"
            placeholder="Your email"
            required
            style={{
              padding: "12px",
              width: "250px",
              marginRight: "10px"
            }}
          />
          <button type="submit" style={{ padding: "12px 20px" }}>
            Join
          </button>
        </form>
      </section>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", marginTop: "80px", color: "#777" }}>
        © {new Date().getFullYear()} Davenport Wardrobe
      </footer>

    </main>
  );
}
