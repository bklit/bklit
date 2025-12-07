interface TriggerDevProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: "default" | "mono";
}

export const TriggerDev = ({
  width = "auto",
  height = "30px",
  className,
  variant = "default",
}: TriggerDevProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 136 24"
      fill="none"
      className={className}
    >
      <title>TriggerDev Logo</title>
      <path
        d="M35.0754 3.21039H24.3296H24.7541V6.13998H28.3721V18.7461H31.4352V6.13998H35.0754V3.21039Z"
        fill={
          variant === "mono" ? "currentColor" : "url(#paint0_linear_12475_3849)"
        }
      />
      <path
        d="M38.0053 9.55785V7.64917H35.142V18.7461H38.0053V13.4418C38.0053 11.1114 39.892 10.4456 41.3792 10.6231V7.42723C39.9808 7.42723 38.5825 8.04866 38.0053 9.55785Z"
        fill={
          variant === "mono" ? "currentColor" : "url(#paint1_linear_12475_3849)"
        }
      />
      <path
        d="M44.4425 6.31754C45.4191 6.31754 46.2182 5.51855 46.2182 4.56422C46.2182 3.60988 45.4191 2.7887 44.4425 2.7887C43.4881 2.7887 42.689 3.60988 42.689 4.56422C42.689 5.51855 43.4881 6.31754 44.4425 6.31754ZM43.0219 18.7461H45.8853V7.64917H43.0219V18.7461Z"
        fill={
          variant === "mono" ? "currentColor" : "url(#paint2_linear_12475_3849)"
        }
      />
      <path
        d="M56.7617 7.64918V9.02519C55.9848 7.98208 54.7862 7.33847 53.2103 7.33847C50.0584 7.33847 47.6834 9.91295 47.6834 13.0201C47.6834 16.1494 50.0584 18.7017 53.2103 18.7017C54.7862 18.7017 55.9848 18.0581 56.7617 17.015V18.2135C56.7617 19.9668 55.6519 20.9433 53.854 20.9433C52.1448 20.9433 51.4124 20.2553 50.9462 19.3898L48.5046 20.788C49.4813 22.5857 51.3902 23.4956 53.7652 23.4956C56.6951 23.4956 59.5585 21.8533 59.5585 18.2135V7.64918H56.7617ZM53.6542 16.0607C51.8563 16.0607 50.5467 14.7956 50.5467 13.0201C50.5467 11.2668 51.8563 10.0017 53.6542 10.0017C55.4521 10.0017 56.7617 11.2668 56.7617 13.0201C56.7617 14.7956 55.4521 16.0607 53.6542 16.0607Z"
        fill={
          variant === "mono" ? "currentColor" : "url(#paint3_linear_12475_3849)"
        }
      />
      <path
        d="M70.4127 7.64918V9.02519C69.6358 7.98208 68.4372 7.33847 66.8612 7.33847C63.7094 7.33847 61.3343 9.91295 61.3343 13.0201C61.3343 16.1494 63.7094 18.7017 66.8612 18.7017C68.4372 18.7017 69.6358 18.0581 70.4127 17.015V18.2135C70.4127 19.9668 69.3029 20.9433 67.5049 20.9433C65.7958 20.9433 65.0633 20.2553 64.5972 19.3898L62.1556 20.788C63.1322 22.5857 65.0411 23.4956 67.4162 23.4956C70.3461 23.4956 73.2094 21.8533 73.2094 18.2135V7.64918H70.4127ZM67.3052 16.0607C65.5073 16.0607 64.1977 14.7956 64.1977 13.0201C64.1977 11.2668 65.5073 10.0017 67.3052 10.0017C69.1031 10.0017 70.4127 11.2668 70.4127 13.0201C70.4127 14.7956 69.1031 16.0607 67.3052 16.0607Z"
        fill={
          variant === "mono" ? "currentColor" : "url(#paint4_linear_12475_3849)"
        }
      />
      <path
        d="M77.9818 14.3739H86.3499C86.4165 13.9966 86.4609 13.6193 86.4609 13.1977C86.4609 9.93515 84.1302 7.33847 80.8452 7.33847C77.3603 7.33847 74.9853 9.89077 74.9853 13.1977C74.9853 16.5046 77.3381 19.0569 81.0671 19.0569C83.198 19.0569 84.8627 18.1913 85.906 16.6821L83.5975 15.3505C83.1092 15.9941 82.2214 16.4602 81.1115 16.4602C79.6022 16.4602 78.3814 15.8387 77.9818 14.3739ZM77.9374 12.1545C78.2704 10.7341 79.3136 9.91295 80.8452 9.91295C82.0438 9.91295 83.2424 10.5566 83.5975 12.1545H77.9374Z"
        fill={
          variant === "mono" ? "currentColor" : "url(#paint5_linear_12475_3849)"
        }
      />
      <path
        d="M91.0224 9.55785V7.64917H88.1591V18.7461H91.0224V13.4418C91.0224 11.1114 92.9091 10.4456 94.3963 10.6231V7.42723C92.9979 7.42723 91.5995 8.04866 91.0224 9.55785Z"
        fill={
          variant === "mono" ? "currentColor" : "url(#paint6_linear_12475_3849)"
        }
      />
      <path
        d="M95.4839 19.0348C96.5271 19.0348 97.3706 18.1915 97.3706 17.1483C97.3706 16.1052 96.5271 15.2619 95.4839 15.2619C94.4406 15.2619 93.5972 16.1052 93.5972 17.1483C93.5972 18.1915 94.4406 19.0348 95.4839 19.0348Z"
        fill={
          variant === "mono" ? "currentColor" : "url(#paint7_linear_12475_3849)"
        }
      />
      <path
        d="M107.514 3.21057V8.95879C106.715 7.93787 105.539 7.33864 103.918 7.33864C100.944 7.33864 98.5026 9.89094 98.5026 13.1978C98.5026 16.5047 100.944 19.057 103.918 19.057C105.539 19.057 106.715 18.4578 107.514 17.4369V18.7463H110.378V3.21057L107.514 3.21057ZM104.451 16.3272C102.675 16.3272 101.366 15.0621 101.366 13.1978C101.366 11.3335 102.675 10.0685 104.451 10.0685C106.205 10.0685 107.514 11.3335 107.514 13.1978C107.514 15.0621 106.205 16.3272 104.451 16.3272Z"
        fill={
          variant === "mono" ? "currentColor" : "url(#paint8_linear_12475_3849)"
        }
      />
      <path
        d="M114.972 14.3741H123.34C123.407 13.9968 123.451 13.6195 123.451 13.1978C123.451 9.93534 121.121 7.33865 117.836 7.33865C114.351 7.33865 111.976 9.89095 111.976 13.1978C111.976 16.5047 114.329 19.057 118.058 19.057C120.188 19.057 121.853 18.1915 122.896 16.6823L120.588 15.3507C120.1 15.9943 119.212 16.4604 118.102 16.4604C116.593 16.4604 115.372 15.8389 114.972 14.3741ZM114.928 12.1547C115.261 10.7343 116.304 9.91314 117.836 9.91314C119.034 9.91314 120.233 10.5568 120.588 12.1547H114.928Z"
        fill={
          variant === "mono" ? "currentColor" : "url(#paint9_linear_12475_3849)"
        }
      />
      <path
        d="M132.086 7.64936L129.378 15.4172L126.692 7.64936H123.54L127.757 18.7463H131.02L135.238 7.64936H132.086Z"
        fill={
          variant === "mono"
            ? "currentColor"
            : "url(#paint10_linear_12475_3849)"
        }
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.33197 7.92275L10.6153 0.504761L21.2306 18.8892H0L4.28333 11.4709L7.31329 13.2202L6.06014 15.3905H15.1705L10.6153 7.50183L9.36215 9.67219L6.33197 7.92275Z"
        fill={
          variant === "mono"
            ? "currentColor"
            : "url(#paint11_linear_12475_3849)"
        }
      />
      <defs>
        <linearGradient
          id="paint0_linear_12475_3849"
          x1="59.3629"
          y1="27.3461"
          x2="59.3629"
          y2="2.7887"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#41FF54" />
          <stop offset="1" stopColor="#E7FF52" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_12475_3849"
          x1="59.3629"
          y1="27.3461"
          x2="59.3629"
          y2="2.7887"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#41FF54" />
          <stop offset="1" stopColor="#E7FF52" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_12475_3849"
          x1="59.3629"
          y1="27.3461"
          x2="59.3629"
          y2="2.7887"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#41FF54" />
          <stop offset="1" stopColor="#E7FF52" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_12475_3849"
          x1="59.3629"
          y1="27.3461"
          x2="59.3629"
          y2="2.7887"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#41FF54" />
          <stop offset="1" stopColor="#E7FF52" />
        </linearGradient>
        <linearGradient
          id="paint4_linear_12475_3849"
          x1="59.3629"
          y1="27.3461"
          x2="59.3629"
          y2="2.7887"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#41FF54" />
          <stop offset="1" stopColor="#E7FF52" />
        </linearGradient>
        <linearGradient
          id="paint5_linear_12475_3849"
          x1="59.3629"
          y1="27.3461"
          x2="59.3629"
          y2="2.7887"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#41FF54" />
          <stop offset="1" stopColor="#E7FF52" />
        </linearGradient>
        <linearGradient
          id="paint6_linear_12475_3849"
          x1="59.3629"
          y1="27.3461"
          x2="59.3629"
          y2="2.7887"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#41FF54" />
          <stop offset="1" stopColor="#E7FF52" />
        </linearGradient>
        <linearGradient
          id="paint7_linear_12475_3849"
          x1="114.417"
          y1="25.4773"
          x2="117.399"
          y2="4.96095"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient
          id="paint8_linear_12475_3849"
          x1="114.417"
          y1="25.4773"
          x2="117.399"
          y2="4.96095"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient
          id="paint9_linear_12475_3849"
          x1="114.417"
          y1="25.4773"
          x2="117.399"
          y2="4.96095"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient
          id="paint10_linear_12475_3849"
          x1="114.417"
          y1="25.4773"
          x2="117.399"
          y2="4.96095"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient
          id="paint11_linear_12475_3849"
          x1="17.1895"
          y1="18.8892"
          x2="16.9913"
          y2="5.91038"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#41FF54" />
          <stop offset="1" stopColor="#E7FF52" />
        </linearGradient>
      </defs>
    </svg>
  );
};
