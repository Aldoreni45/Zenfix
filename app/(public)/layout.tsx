import Navbar from "@/components/Navbar";
import Preloader from "@/components/Preloader";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Preloader>
      <Navbar />
      {children}
    </Preloader>
  );
}
