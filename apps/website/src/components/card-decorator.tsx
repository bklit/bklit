export const CardDecorator = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className="lightsaber">
      <span className={className}>{children}</span>
    </div>
  );
};
