'use server'

import { z } from "zod"
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from "next-auth";

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

// 4. Con coerce transformamos el tipo, que puede llegar como string, a un number. (puede usarse para transformar a string, fechas, etc.) 
// (no tiene por que ser siempre number).
// Como estamos haciendo una coercion de string a number, si el campo no se llena siempre llegara en 0. Por lo tanto, le estableceremos a Zod que siempre queremos
// un valor mayor a 0 en este campo con la funcion .gt()

// 5. Es la estructura de tipado que tendrá prevState. prevState en createInvoice hace referencia al estado anterior o inicial que recibira o tendra createInvoice,
// que, en este caso, será ==> const initialState = {message: null, errors: {} }; (en create-form.tsx) <== dado que dicho estado es enviado por useFormState al 
// accionarse a través del dispatch en el form.

// 6. parse vs safeParse:

// --> parse: Este método intenta analizar y validar los datos de entrada según el esquema especificado. Si la validación falla, parse lanzará una excepción 
// de tipo ZodError que contiene información detallada sobre los errores de validación encontrados. Esto significa que parse es una operación "no segura" (unsafe),
//  ya que puede arrojar una excepción que debe ser manejada por el código que llama.

// --> safeParse: A diferencia de parse, safeParse es una operación "segura" (safe) que no arroja excepciones en caso de errores de validación. En su lugar, 
// devuelve un objeto ZodParsedType<T>, que es un objeto que contiene dos propiedades: success (indicando si la validación fue exitosa) y data (que contiene 
// los datos validados si success es true, o undefined si la validación falló). Esto hace que safeParse sea útil en situaciones donde prefieres manejar los errores 
// de validación de manera más controlada sin necesidad de usar bloques try-catch.

// ===> DOCUMENTATION <===

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
  .number()
  .gt(0, { message: 'Please enter an amount greater than $0.' }), // ==> 4.
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.'
  }),
  date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true})
const UpdateInvoice = FormSchema.omit({ id: true, date: true})

// 5.
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
}

export async function createInvoice(prevState: State, formData: FormData) {
  // 1.
  // const { customerId, amount, status } = CreateInvoice.parse({
  //   customerId: formData.get('customerId'),
  //   amount: formData.get('amount'),
  //   status: formData.get('status'),
  // });

  // 6.
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if(!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
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

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  // const { customerId, amount, status } = UpdateInvoice.parse({
  //   customerId: formData.get('customerId'),
  //   amount: formData.get('amount'),
  //   status: formData.get('status'),
  // });

  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status')
  })

  if(!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.'
    };
  }

  const { customerId, amount, status } = validatedFields.data;

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

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if(error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
          default: 
            return 'Something went wrong.';
      }
    }
    throw error;
  }
}