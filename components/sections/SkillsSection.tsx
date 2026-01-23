import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";
import { SkillsChart } from "./SkillsChart";

const SKILLS_CATEGORIES_QUERY =
  defineQuery(`*[_type == "skillCategory"] | order(order asc){
  name,
  skills[]->{
    name,
    category,
    proficiency,
    percentage,
    yearsOfExperience,
    color
  }
}`);

export async function SkillsSection() {
  const { data: categories } = await sanityFetch({
    query: SKILLS_CATEGORIES_QUERY,
  });

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section id="skills" className="py-20 px-6 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Skills & Expertise
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive overview of my technical proficiencies and tools I
            work with daily
          </p>
        </div>

        <SkillsChart categories={categories} />
      </div>
    </section>
  );
}
