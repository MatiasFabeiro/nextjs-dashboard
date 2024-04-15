import './ui/global.css'
import { montserrat } from './ui/fonts'
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Acme Dashboard',
    default: 'Acme Dashboard',
  },
  description: 'The official Next.js Course Dashboard, built with App Router.',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} antialiased`}> {/* <-- antialiased mejora como se renderiza la fuente */}
        {children}

        <footer className='py-10 flex justify-center items-enter'> 
          Hecho con ❤️ por la gente de Vercel
        </footer>
      </body>
    </html>
  );
}