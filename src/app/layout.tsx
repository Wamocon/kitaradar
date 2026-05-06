import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Root layout is a pass-through; the locale layout renders <html> and <body>.
  return children;
}

