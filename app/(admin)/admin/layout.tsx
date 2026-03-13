import { AdminHeader } from "@/components/admin/layout/AdminHeader"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AdminHeader />
      <main>{children}</main>
    </>
  )
}
