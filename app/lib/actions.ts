'use server'

import { z } from "zod"
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ===> DOCUMENTATION <===
// 1.
// La siguiente forma se utiliza cuando hay pocos campos y queremos utilizar un get() de XML HTTP Request API. Lo que hace es que el nombre que le pasamos a get(name),
// lo busca dentro de los campos name="" que existan dentro del form y cuando lo encuentra toma el valor y lo asocia al name.

// Luego, con el parse en Zod, especificamos que se validen y transformen los datos a lo solicitado en el Schema de Zod declarado en la constante de FormSchema,
// en la constante de CreateInvoices se establece que se omitan los valores de id y de date al estar especificados como true, otra opcion seria que en el schema inicial
// a dichos valores se los establezca como .optional()

// 2.
// La siguiente forma se utiliza cuando hay muchos campos, formData.entries() 
// devuelve un iterador que contiene los pares clave/valor para cada elemento en el objeto FormData.

// Object.fromEntries(): Este método está disponible a partir de ECMAScript 2019 (también conocido como ES10). Toma una lista de pares clave/valor 
// (como la que obtienes de formData.entries()) y los convierte en un objeto. Cada par clave/valor se convierte en una propiedad en el objeto resultante,
// donde la clave del par se convierte en el nombre de la propiedad y el valor se convierte en el valor de esa propiedad.

// Entonces, cuando usamos formData.entries() para obtener todos los pares clave/valor del objeto FormData, y luego aplicamos Object.fromEntries() 
// a esa lista de pares clave/valor, obtenemos un objeto plano que contiene todos los datos del formulario, lo que hace que sea más fácil de manejar 
// y trabajar con ellos en comparación con el objeto FormData original, especialmente si necesitas manipular o enviar estos datos a través de una API, por ejemplo.


// 3. El revalidatePath srive para actualizar los datos de /dashboard/invoices dad oque estamos actualizando (mutando) los datos a traves de una peticion sql,
// por lo tanto para que se limpie el cache y se muestren los nuevos datos debemos utilizar el revalidate, lo siguiente es una redireccion con el redirect de next
// para que cuando se cree el invoice se envie al usuario directamente a la pagina de /dashboard/invoices.

// ===> DOCUMENTATION <===

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true})
const UpdateInvoice = FormSchema.omit({ id: true, date: true})

export async function createInvoice(formData: FormData) {
  // 1.
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0]; // ==> Create a new date with the format "YYYY-MM-DD"

  try{
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `; // ===> Se espera a insertar los datos dentro de la base de datos
  } catch (e) {
    return {
      message: 'Error creating Invoice.'
    }
  }

  // 2.
  // const rawFormData = Object.fromEntries(formData.entries());
  
  // console.log(`customerId: ${customerId}`, `amount: ${amount}`, `status: ${status}`);

  // 3.
  console.log('Invoice Created.')
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id:string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try{
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (e) {
    return{
      message: 'Error updating Invoice.'
    }
  }

  console.log('Invoice Updated.')
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice');
  
  try{
    await sql`DELETE FROM invoices WHERE id = ${id}`
    revalidatePath('/dashboard/invoices')
    return { message: 'Invoice Deleted.' };
  } catch (e) {
    return{
      message: 'Error deleting Invoice.'
    }
  }

}