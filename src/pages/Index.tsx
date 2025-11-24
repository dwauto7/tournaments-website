import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Trophy, Users, Calendar, Award } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Organize Epic Tournaments
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create, manage, and join competitive gaming tournaments. 
            Connect with players worldwide and compete for glory.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-hero text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose TourneyHub?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-card hover:shadow-hover transition-all">
              <Trophy className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Easy Setup</h3>
              <p className="text-muted-foreground">
                Create tournaments in minutes with our intuitive interface
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-card hover:shadow-hover transition-all">
              <Users className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Build Community</h3>
              <p className="text-muted-foreground">
                Connect with players and build your gaming community
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-card hover:shadow-hover transition-all">
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
              <p className="text-muted-foreground">
                Manage tournament dates and track progress effortlessly
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-card hover:shadow-hover transition-all">
              <Award className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Compete & Win</h3>
              <p className="text-muted-foreground">
                Join tournaments and compete for prizes and recognition
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of gamers organizing and competing in tournaments every day
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-hero text-lg px-8">
              Create Your First Tournament
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 TourneyHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
