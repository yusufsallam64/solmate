import type { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getProviders, useSession } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import AuthProviderBlock from "@/lib/components/auth/AuthProviderBlock";
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { DatabaseService } from '@/lib/db/service';
import clsx from "clsx";
import router from "next/router";
import PhantomConnect from "@/lib/components/PhantomConnect";

const SignUp = ({
    providers,
    error,
}: InferGetServerSidePropsType<typeof getServerSideProps>): JSX.Element => {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-linear-to-br from-primary-950 to-background-950">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-linear-to-br from-accent-400/10 to-transparent rounded-full blur-3xl transform rotate-12" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-linear-to-tl from-secondary-500/10 to-transparent rounded-full blur-3xl transform -rotate-12" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
                <div className="text-center mb-8">
                    <div className="flex flex-col items-center space-y-4">
                        <svg className="text-accent-400 w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h1 className="text-3xl font-bold">
                            <span className="bg-linear-to-r from-accent-400 via-accent-500 to-secondary-500 text-transparent bg-clip-text">
                                Welcome to Insightfully
                            </span>
                        </h1>
                    </div>
                </div>

                {error && (
                    <div className="w-full max-w-md p-4 border-2 border-red-500/50 bg-red-500/10 text-red-500 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                <div className="w-full max-w-md">
                    <div className="space-y-6">
                        {/* Step 1: Sign In */}
                        <div className={clsx(`p-6 bg-background-800/40 backdrop-blur-lg rounded-2xl border`, session ? 'border-accent-500/50 opacity-50' : 'border-primary-900/50')}>
                            <div className="flex items-center mb-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-500 text-white font-bold mr-3">
                                    1
                                </div>
                                <h2 className="text-xl font-semibold text-white">Sign In</h2>
                                {session && (
                                    <svg className="h-6 w-6 text-accent-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            {!session && (
                                <div className="space-y-3">
                                    <PhantomConnect />
                                </div>
                            )}
                            {session && (
                                <p className="text-primary-200">
                                    Signed in as {session.user?.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 text-center text-sm text-primary-200">
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="text-accent-400 hover:text-accent-500 underline">
                            Terms
                        </Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-accent-400 hover:text-accent-500 underline">
                            Privacy Policy
                        </Link>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                           onClick={() => router.push('/')}
                           className="mx-auto group inline-flex items-center gap-2 px-8 py-3 border-2 border-accent-500/50 text-white rounded-lg hover:border-accent-500 hover:shadow-lg hover:shadow-accent-400/20 focus:outline-hidden focus:ring-2 focus:ring-accent-400 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-[102%]">
                           <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 my-auto transition-transform duration-300" />
                           <p>Back to Home</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getServerSession(context.req, context.res, authOptions);
    
    if (session?.user?.email) {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        };
    }

    const providers = await getProviders();
    
    // Handle any issues with OAuth
    const { error } = context.query;
    const getErrorMessage = (error: string) => {
        switch (error) {
            case 'OAuthAccountNotLinked':
                return 'An account with this email already exists using a different sign-in method. Please use the same sign-in method you used originally.';
            default:
                return 'An error occurred during sign in. Please try again.';
        }
    };

    return {
        props: { 
            providers: providers ?? [],
            error: error ? getErrorMessage(error as string) : null
        }
    };
}

export default SignUp;