export default async function Layout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="container mx-auto">
      {children}
      {modal}
    </div>
  );
}
