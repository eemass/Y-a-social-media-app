const LoadingDots = ({ size = "md" }) => {
  const sizeClass = `loading-${size}`;

  return <span className={`loading loading-dots ${sizeClass}`} />;
};
export default LoadingDots;
