import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container container-narrow">
        <div className="eyebrow">404</div>
        <h1>Page not found</h1>
        <p className="lead">
          The page you requested is not part of this local SAP study clone.
        </p>
        <Link className="btn btn-primary" href="/">
          Return to SAP home
        </Link>
      </div>
    </section>
  );
}
