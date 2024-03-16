import './ui/global.css'
import { montserrat } from './ui/fonts'

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