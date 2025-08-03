declare module 'next/types' {
  interface PageProps {
    params: Promise<{ groupId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }
}