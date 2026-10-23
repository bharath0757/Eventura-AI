"use client";
import { Button } from "@/components/controls";
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="container page empty"><h1>Something interrupted the plan.</h1><p>Please try again. Your saved browser data has not been cleared.</p><Button onClick={reset}>Try again</Button></div>;}
