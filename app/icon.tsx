import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#070709",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "7px",
          position: "relative",
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute" }}
        >
          <defs>
            <linearGradient
              id="goldGradient"
              x1="2"
              y1="3"
              x2="22"
              y2="21.35"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FDE68A" />
              <stop offset="0.5" stopColor="#D4AF37" />
              <stop offset="1" stopColor="#926F28" />
            </linearGradient>
          </defs>
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            stroke="url(#goldGradient)"
            strokeWidth="1.2"
            fill="rgba(196, 155, 85, 0.12)"
          />
        </svg>
        <span
          style={{
            fontFamily: "serif",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            marginTop: "-1px",
            background:
              "linear-gradient(135deg, #FFF1B8 0%, #D4AF37 60%, #AA7C11 100%)",
            backgroundClip: "text",
            color: "transparent",
            display: "flex",
          }}
        >
          TS
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
