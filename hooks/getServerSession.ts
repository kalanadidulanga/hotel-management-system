import { auth } from "@/auth"

export const session = async ()=>{
 const s = await auth()

    if (!s?.user) return null;

  

    return s?.user
}