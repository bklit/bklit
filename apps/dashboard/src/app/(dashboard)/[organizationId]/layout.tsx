export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full flex-1">{children}</div>;
}
