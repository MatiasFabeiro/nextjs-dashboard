'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
// useDebouncedCallback es una funcion que envuelve la porcion de codigo que especifiquemos, en este caso el interior de la funcion handleSearch, 
// encargada de detectar cuando el usuario esta tipeando, cada vez que se tipea debounce lo detecta y resetea el timer, si el timer llega a 0 se captura la data
// tipeada y luego hacemos el fetching, esto sirve para no enviar miles de peticiones por cada tipeo en la barra de search.
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  
  // searchParams necesita que le pasemos un metodo para que pueda actuar, lo mas comun es get o set, ej: searchParams.set('query', 'hola') ==>
  // searchParams.toString ==> "query=hola".
  // con el get podemos buscar el nombre como por ejemplo 'query' y traer el valor del mismo. ==> console.log("Search params:", searchParams.get('query'))
  const searchParams = useSearchParams()
  const pathname = usePathname() // <== trae el URL en el que este posicionado el usuario al entrar a esta pagina, solo existe en client no en server.
  const { replace } = useRouter() // <== por deestructuracion, traemos replace del hook useRouter() y lo que hace es ayudarnos a reemplazar la URL por lo que le asignemos.
  

  const handleSearch = useDebouncedCallback((term: string) => {
    console.log(`Searching... ${term}`);
    const params = new URLSearchParams(searchParams)

    if(term){
      params.set('search', term)
    } else{
      params.delete('search')
    }

    replace(`${pathname}?${params.toString()}`)
  }, 500)
  
  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        onChange={(e) => handleSearch(e.target.value)}
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        defaultValue={searchParams.get('search')?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
