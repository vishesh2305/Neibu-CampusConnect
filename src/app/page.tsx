"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from "../components/ui/resizeable-navbar";
import { StickyScroll } from "../components/ui/sticky-scroll-reveal";
import Image from "next/image";
import { Spotlight } from "@/components/ui/spotlight-new";
import { PinContainer } from "@/components/ui/3d-pin";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

export default function Page() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const navLinks = [
    { name: "Home", link: "/" },
    { name: "Log In", link: "/login" },
    { name: "Sign Up", link: "/signup" },
  ];

  const contentData = [
    {
      title: "Discover Events",
      description:
        "Stay informed about university happenings and never miss an event again.",
      content: (
          <div className="h-full w-full flex items-center justify-center text-white">
            <p className="text-lg">🎉 Campus Life</p>
          </div>
      ),
    },
    {
      title: "Join Groups",
      description:
        "Find and join groups with like-minded students to share your passions.",
      content: (
        <div className="h-full w-full flex items-center justify-center text-white">
          <p className="text-lg">🤝 Community</p>
        </div>
      ),
    },
    {
        title: "Build Your Network",
        description:
          "Connect with peers, alumni, and faculty to build a professional network that lasts a lifetime.",
        content: (
          <div className="h-full w-full flex items-center justify-center text-white">
            <p className="text-lg">📚 Network and Grow</p>
          </div>
        ),
      },
  ];

      const placeholders = [
        "What's a feature you'd love to see?",
        "Any suggestions for improvement?",
        "What do you love about CampusConnect?",
        "How can we make your experience better?",
        "Share your thoughts with us!",
    ];

  const dummyContent = [
    {
      title: "Your Campus, Connected",
      description: (
        <>
          <p>
            Join the community and start connecting with students and faculty. Share your ideas, collaborate on projects, and make new friends.
          </p>
        </>
      ),
      badge: "Community",
      image:
        "/images/campus_friends.png",
    },
    {
      title: "Discover and Create Events",
      description: (
        <>
          <p>
          Stay updated with the latest events happening on campus. From workshops to cultural fests, there&apos;s always something new to explore.
          </p>
        </>
      ),
      badge: "Events",
      image:
        "/images/campus_events.png",
    },
    {
      title: "Join and Form Groups",
      description: (
        <>
          <p>
          Connect with like-minded peers by joining groups that match your interests. Whether you&apos;re into coding, music, or sports, there&apos;s a group for you.
          </p>
        </>
      ),
      badge: "Groups",
      image:
        "/images/campus_groups.png",
    },
  ];
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value);
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("submitted");
    };

  return (
    <div className="flex flex-col min-h-screen bg-black/[0.96]">
      <Navbar>
        <NavBody>
          {session?.user?.image && (
            <Link href="/profile/edit">
              <Image
                src={session.user.image}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full cursor-pointer"
              />
            </Link>
          )}
          <NavItems items={navLinks} onItemClick={() => setIsMobileMenuOpen(false)}/>
          <NavbarButton href="/signup" variant="gradient">
            Sign Up
          </NavbarButton>
        </NavBody>
        <MobileNav visible>
          <MobileNavHeader>
            {session?.user?.image && (
              <Link href="/profile/edit">
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full cursor-pointer"
                />
              </Link>
            )}
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            />
          </MobileNavHeader>
          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.link}
                className="w-full px-2 py-2 text-sm font-medium text-black dark:text-white hover:underline"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Spotlight Hero Section */}
      <div className="h-screen w-full flex items-center justify-center bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
        <Spotlight
        />
        <div className="p-4 max-w-7xl mx-auto relative z-10 w-full text-center">
          <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
            Connect with Your Campus
          </h1>
          <p className="mt-4 font-normal text-base text-neutral-300 max-w-lg text-center mx-auto">
            The exclusive social network for university students. Share updates,
            join groups, and discover events at your school.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
<main className="w-full bg-black">


      {/* Step 2: Wrap existing sections with TracingBeam */}
      <TracingBeam className="px-6">
        <div className="max-w-2xl mx-auto antialiased pt-4 relative">
          {dummyContent.map((item, index) => (
            <div key={`content-${index}`} className="mb-10">
              <h2 className="bg-black text-white rounded-full text-sm w-fit px-4 py-1 mb-4">
                {item.badge}
              </h2>

              <p className="text-xl mb-4">
                {item.title}
              </p>

              <div className="text-sm prose prose-sm dark:prose-invert">
                {item?.image && (
                  <Image
                    src={item.image}
                    alt="blog thumbnail"
                    height="1000"
                    width="1000"
                    className="rounded-lg mb-10 object-cover"
                  />
                )}
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </TracingBeam>

      {/* 3D Pin Section */}
      <div className=" h-[40rem] z-0 w-full flex items-center justify-center ">
        <PinContainer
            title="CampusConnect"
            href="/signup"
        >
            <div className="flex basis-full flex-col p-4 tracking-tight text-slate-100/50 sm:basis-1/2 w-[20rem] h-[20rem] ">
                <h3 className="max-w-xs !pb-2 !m-0 font-bold  text-base text-slate-100">
                    Your Campus, Connected
                </h3>
                <div className="text-base !m-0 !p-0 font-normal">
                    <span className="text-slate-500 ">
                        Join the community and start connecting with students and faculty.
                    </span>
                </div>
                <div className="flex flex-1 w-full rounded-lg mt-4 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500" />
            </div>
        </PinContainer>
      </div>

      {/* Globe Section */}
      <div className="relative flex flex-col items-center justify-center py-20 bg-black/[0.96] antialiased">
        <h2 className="text-3xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
          Connect from Anywhere
        </h2>
        <p className="mt-4 font-normal text-base text-neutral-300 max-w-lg text-center mx-auto">
          No matter where you are in the world, CampusConnect keeps you linked to your university community.
        </p>
      </div>


      {/* StickyScroll Section */}
        <StickyScroll content={contentData} />



                  {/* suggestions input section */}
          <div className="h-[40rem] flex flex-col justify-center items-center px-4">
              <h2 className="mb-10 sm:mb-20 text-xl text-center sm:text-5xl dark:text-white text-black">
                  Have a Suggestion? Let us know!
              </h2>
              <PlaceholdersAndVanishInput
                  placeholders={placeholders}
                  onChange={handleChange}
                  onSubmit={onSubmit}
              />
          </div>




      </main>
    </div>
  );
}