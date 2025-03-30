import { User } from "lucide-react";

const testimonials = [
  {
    text: "Before treatment, I couldn't look at my backyard without adding magical forest spirits. Now I see it for what it is: a mediocre lawn with ant problems.",
    author: "Former Ghibli Addict, 32"
  },
  {
    text: "I used to see giant forest spirits in every large tree. Thanks to Ghibli Detox, I now correctly identify them as potential fire hazards.",
    author: "Recovering Miyazaki Fan, 28"
  },
  {
    text: "My children's drawings were becoming too whimsical. After treatment, they're appropriately dull and realistic.",
    author: "Concerned Parent, 41"
  },
  {
    text: "The sparkles in my food photos were out of control. Now I can share properly mundane meal pics on social media.",
    author: "Reformed Foodstagrammer, 26"
  }
];

export default function Testimonials() {
  return (
    <section className="max-w-4xl mx-auto my-12 bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recovery Testimonials</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-clinic-blue flex items-center justify-center">
                    <User className="h-4 w-4 text-clinic-blue-dark" />
                  </div>
                </div>
                <div>
                  <p className="text-sm italic">
                    "{testimonial.text}"
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    - {testimonial.author}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
