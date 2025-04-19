import React from "react";

function Footer() {
    return (
        <footer className="bg-white border-y-gray-950">
            <div cla ssName="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
                <div className="flex flex-wrap justify-evenly items-center py-5 bg-gray-50">
                    <span className="text-sm text-gray-500 text-center">
                        <a href="#" className="hover:underline">
                            B. Pavan Teja
                        </a>
                    </span>
                    <span className="text-sm text-gray-500 text-center">
                        <a href="#" className="hover:underline">
                            G. Pranav
                        </a>
                    </span>
                    <span className="text-sm text-gray-500 text-center">
                        <a href="#" className="hover:underline">
                            Mohd Ajmal Taha
                        </a>
                    </span>
                    <span className="text-sm text-gray-500 text-center">
                        <a href="#" className="hover:underline">
                            K. Sai Prasad
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;