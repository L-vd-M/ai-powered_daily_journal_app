// display a page similar to the journal entry page, as a placeholder for the journal view page
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
          placeholder="Previous journal entries..."
        ></textarea>
        
        {/* table to present the user with their previous journal entries */ }
        {/* Information is pulled from the journalEntries table based on the user's id, and presented in a table with two columns: date and entry */ }
        {/* <table className="w-full mt-5 border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Date</th>
              <th className="border border-gray-300 px-4 py-2">Entry</th>
            </tr>
          </thead>
          <tbody>*/}
            {/* Example row - replace with dynamic data from journalEntries table */ }
            {/*<tr>
              <td className="border border-gray-300 px-4 py-2">2024-06-01</td>
              <td className="border border-gray-300 px-4 py-2">
                Today I had a great day! I went to the park and enjoyed the sunshine.
              </td>
            </tr>
          </tbody>
        </table> */}

        {/* Button to post journal entry */}
        <div className="flex mt-5 items-center justify-center">
          <Button>Post to Journal</Button>
        </div>
      </main>
    </div>
  );
}