export default async function Layout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="w-full flex-1">
      {children}
      {modal}
    </div>
  );
}
