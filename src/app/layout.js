import "./globals.css";

export const metadata = {
  title: "Focus Todo",
  description: "ブラウザに保存できるシンプルなTODOリスト",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
