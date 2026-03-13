const krwFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
})

export function formatKRW(value: number) {
  return krwFormatter.format(value)
}
