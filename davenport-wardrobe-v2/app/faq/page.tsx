"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "What is Davenport Wardrobe?",
    answer:
      "Davenport Wardrobe is a modern menswear platform that gives you access to high-quality clothing without traditional ownership. You wear what you need, when you need it — without clutter or commitment.",
  },
  {
    question: "How does it work?",
    answer:
      "You select clothing from a rotating wardrobe curated with the help of AI. Pieces are delivered to your doorstep, worn on your terms, and returned or kept as pricing adjusts with wear over time.",
  },
  {
    question: "How does AI help?",
    answer:
      "Our system suggests outfits based on your lifestyle, preferences, and past selections. You stay in control — the AI simply narrows your options and evolves with your style.",
  },
  {
    question: "Is this sustainable?",
    answer:
      "Yes. By extending the lifecycle of garments and reducing unnecessary production, Davenport Wardrobe helps lower textile waste and overproduction while maintaining premium quality.",
  },
  {
    question: "Who is this for?",
    answer:
      "Davenport Wardrobe is built for students, young professionals, and anyone who values flexibility, efficiency, and refined style without excess ownership.",
  },
  {
    question: "Do I have to store clothes?",
    answer:
      "No. Since pieces rotate through the system, you avoid long-term storage, seasonal packing, and clutter — saving space and time.",
  },
  {
    question: "When are you launching?",
    answer:
      "We’re currently refining the platform. You can join the waitlist on the homepage to get early access and updates.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "80px 24px",
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          fontSize: "2.75rem",
          marginBottom: "48px",
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}
      >
        Frequently Asked Questions
      </motion.h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                borderRadius: "12px",
                background: "#f7f7f7",
                padding: "24px",
                cursor: "pointer",
              }}
              onClick={() =>
                setOpenIndex(isOpen ? null : index)
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 500,
                  }}
                >
                  {faq.question}
                </h3>
                <span
                  style={{
                    fontSize: "1.5rem",
                    opacity: 0.6,
                  }}
                >
                  {isOpen ? "–" : "+"}
                </span>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    style={{
                      marginTop: "16px",
                      lineHeight: 1.6,
                      color: "#444",
                      overflow: "hidden",
                    }}
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}