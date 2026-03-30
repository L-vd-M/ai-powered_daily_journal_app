// display simple Hello World page for testing
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {/* Textbox for entering journal entry */ }
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="Mood for the day..."
        ></textarea>

        {/* Button to post journal entry */}
        <div className="flex mt-5 items-center justify-center">
          <Button>Post to Journal</Button>
        </div>
      </main>
    </div>
  );
}
