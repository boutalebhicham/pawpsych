
export function Footer() {
  return (
    <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t mt-8">
      <div className="container mx-auto text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PawPsych. All rights reserved.</p>
      </div>
    </footer>
  );
}
