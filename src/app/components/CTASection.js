import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-16 bg-[#881337]">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Transform Your Beauty Routine?
        </h2>
        <p className="text-xl text-[#FCE7F3] mb-8">
          Join thousands of satisfied customers and discover your perfect beauty products today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#881337] font-semibold rounded-lg hover:bg-[#FDF2F8] transition-colors"
          >
            Start Shopping
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#881337] transition-colors"
          >
            Manage Store
          </Link>
        </div>
      </div>
    </section>
  );
}
