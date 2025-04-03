export const Dot: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={{
      display: "inline-block",
      width: "0.8rem",
      height: "0.8rem",
      borderRadius: "50%",
      backgroundColor: color,
      marginRight: "0.5rem",
    }}
  />
);
