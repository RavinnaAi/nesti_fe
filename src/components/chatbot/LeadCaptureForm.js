import { useState } from "react";

export default function LeadCaptureForm({ onSubmit }) {
    const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-primary/20 p-4 rounded-2xl shadow-sm space-y-3">
            <h4 className="text-sm font-semibold text-primary">Great! Let&apos;s get you connected.</h4>
            <input
                type="text"
                name="name"
                placeholder="Your Name"
                required
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none"
            />
            <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none"
            />
            <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none"
            />
            <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-xl text-sm font-bold hover:brightness-95 transition"
            >
                Send Details
            </button>
        </form>
    );
}
