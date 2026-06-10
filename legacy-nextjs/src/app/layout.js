import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Davenport Wardrobe",
  description: "Davenport — A smarter way for men to dress.",
  openGraph: {
    title: "Davenport Wardrobe",
    description: "Davenport — A smarter way for men to dress.",
    url: "https://davenport.rentals",
    siteName: "Davenport Wardrobe",
    images: [
      {
        url: "https://i.postimg.cc/tCGwQRHF/66568947-4778-447C-A28D-9605166EB47B.png",
        width: 1200,
        height: 630,
        alt: "Davenport Wardrobe",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Davenport Wardrobe",
    description: "Davenport — A smarter way for men to dress.",
    images: ["https://i.postimg.cc/tCGwQRHF/66568947-4778-447C-A28D-9605166EB47B.png"],
  },
  icons: {
    icon: "https://i.postimg.cc/tCGwQRHF/66568947-4778-447C-A28D-9605166EB47B.png",
    shortcut: "https://i.postimg.cc/tCGwQRHF/66568947-4778-447C-A28D-9605166EB47B.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
