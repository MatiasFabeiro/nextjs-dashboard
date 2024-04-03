import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers } from '@/app/lib/data';
 
// ===> DOCUMENTATION <===

// 1. 
// A diferencia de los searchParams, que buscan de forma nativa leer los params especificados en una URL, los params buscan que cuando una carpeta/ruta declarada
// entre [] reciban el valor, con params nosotros podemos tomar este valor y utilizarlo en el componente.

// ===> DOCUMENTATION <===

// 1.
export default async function EditInvoices({ params }: { params: { id: string } }) {
  const id = params.id;

  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ])

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}