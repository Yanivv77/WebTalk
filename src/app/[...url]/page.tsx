import Chat from "@/components/Chat";
import { ragChat } from "@/lib/rag-chat";
import { redis } from "@/lib/redis";
import { cookies } from "next/headers";

interface PageProps {
  params: {
    url: string | string[] | undefined;
  };
}

function reconstructUrl({url}:{url: string[]}) {
  const decodedComponents = url.map((component) => decodeURIComponent(component))
  return decodedComponents.join('/')
}

const Page = async ({ params }: PageProps) => {

  const sessionCookie = cookies().get("sessionId")?.value
  const reconstructedUrl = reconstructUrl({ url: params.url as string[] })

  const sessionId = (reconstructedUrl + "--" + sessionCookie).replace(/\//g, "")


  const isAReadyIndexed = await redis.sismember("indexed",reconstructedUrl)

  const initialMessage = await ragChat.history.getMessages({amount:10,sessionId})

  

  if(!isAReadyIndexed){
    await ragChat.context.add({
      type:"html",
      source:reconstructedUrl,
      config:{chunkOverlap:50,chunkSize:200}
    })

    await redis.sadd("indexed",reconstructedUrl)
  }

  return <Chat sessionId={sessionId} initialMessages={initialMessage} reconstructedUrl={reconstructedUrl}/>
};

export default Page;

