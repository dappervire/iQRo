// Tanda potong (crop marks) di 4 sudut, seperti pada proof cetak.
// Dipasang di dalam elemen yang punya kelas `relative`.
const SUDUT = [
  "-left-3 -top-3 border-l border-t",
  "-right-3 -top-3 border-r border-t",
  "-bottom-3 -left-3 border-b border-l",
  "-bottom-3 -right-3 border-b border-r",
];

export default function TandaPotong() {
  return (
    <>
      {SUDUT.map((posisi) => (
        <span
          key={posisi}
          aria-hidden="true"
          className={`pointer-events-none absolute size-3 border-teks-redup ${posisi}`}
        />
      ))}
    </>
  );
}
