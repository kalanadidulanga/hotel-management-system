import { session } from "@/hooks/getServerSession"


export default async function UserAvatar() {
   
  const user = await session()

 

    return (
        <div>
           {user?.email}
            {user?.name}
        </div>
    )
}