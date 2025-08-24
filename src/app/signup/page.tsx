"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { cn } from "@/lib/utils";
import { AnimatedTestimonials } from '@/components/ui/animated-testimonials';

export default function SignupPage() {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const testimonials = [
    {
      quote: "This platform is amazing! It's so easy to use and has helped me a lot.",
      name: "Vishesh",
      designation: "Developer",
      src: "/images/anime-boy-dark.png",
    },
    {
      quote: "I love the user interface. It's clean, modern, and intuitive.",
      name: "Vishesh",
      designation: "Designer",
      src: "/images/young_man_anime.png",
    },
    {
      quote: "I love the user interface. It's clean, modern, and intuitive.",
      name: "Vishesh",
      designation: "Engineer",
      src: "/images/head_covered_man.png",
    },
    {
      quote: "I love the user interface. It's clean, modern, and intuitive.",
      name: "Vishesh",
      designation: "Bug Hunter",
      src: "/images/anime_girl.png",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      setError('All fields are necessary.');
      return;
    }

    // ✅ Correct regex for .edu or .edu.xx (like .edu.in)
    const eduEmailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.edu(\.[A-Za-z]{2,})?$/;

    if (!eduEmailRegex.test(email)) {
      setError('Please use a valid university email (e.g. johndoe@xyz.edu or johndoe@xyz.edu.in).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${firstname} ${lastname}`,
          email,
          password,
        }),
      });

      if (res.ok) {
        const form = e.target as HTMLFormElement;
        form.reset();
        router.push('/login');
      } else {
        const { message } = await res.json();
        setError(message || 'An error occurred during registration.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" flex items-center justify-evenly min-h-screen ">
      <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Welcome to CampusConnect
        </h2>
        <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
          Create your account to connect with your university community.
        </p>

        <form className="my-8" onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-red-500 bg-red-900/20 p-3 rounded-md mb-4">
              {error}
            </p>
          )}
          <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <LabelInputContainer>
              <Label htmlFor="firstname">First name</Label>
              <Input id="firstname" placeholder="John" type="text" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="lastname">Last name</Label>
              <Input id="lastname" placeholder="Doe" type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} />
            </LabelInputContainer>
          </div>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">University Email (.edu)</Label>
            <Input id="email" placeholder="johndoe@university.edu" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input id="password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </LabelInputContainer>
          <LabelInputContainer className="mb-8">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              placeholder="••••••••"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </LabelInputContainer>

          <button
            className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign up →'}
            <BottomGradient />
          </button>
        </form>
        <p className="text-sm text-center text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-500 hover:underline">
            Log In
          </Link>
        </p>
      </div>

      <div className="hidden md:flex flex-col items-center justify-center w-1/2 p-10 text-white">
        <AnimatedTestimonials testimonials={testimonials} />
      </div>
    </div>
  );
}

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>
    {children}
  </div>
);
