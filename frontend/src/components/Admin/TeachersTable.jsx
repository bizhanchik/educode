import React, { useMemo, useState } from 'react';

const defaultTeachers = [
  { id: 1, name: 'Мартынцов Николай Викторович', email: 'martyn@edu.kz', course: 'Алгоритмизация', students: 32 },
  { id: 2, name: 'Сауле Амангельды', email: 'saule@edu.kz', course: 'Базы данных', students: 28 },
  { id: 3, name: 'Бекзат Ермек', email: 'bekzat@edu.kz', course: 'Графика', students: 19 },
];

const TeachersTable = () => {
  const [data] = useState(defaultTeachers);
  const [sortKey, setSortKey] = useState('name');
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return asc ? av - bv : bv - av;
      return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [data, sortKey, asc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  const setSort = (key) => {
    if (key === sortKey) setAsc(!asc);
    else { setSortKey(key); setAsc(true); }
  };

  return (
    <div>
      <div className="mb-4">
        <button className="px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm hover:bg-blue-700">Добавить преподавателя</button>
      </div>
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSort('name')}>ФИО преподавателя</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSort('email')}>Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSort('course')}>Преподаваемый курс</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSort('students')}>Кол-во студентов</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, idx) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 border-t border-gray-200">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border-t border-gray-200">
                  <button className="text-blue-700 hover:underline" title="Профиль">{row.name}</button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 border-t border-gray-200">{row.email}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border-t border-gray-200">{row.course}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border-t border-gray-200">{row.students}</td>
                <td className="px-4 py-3 text-sm text-gray-900 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <button className="text-gray-500 hover:text-gray-800" title="Редактировать">✏️</button>
                    <button className="text-gray-500 hover:text-gray-800" title="Удалить">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Стр. {page} из {totalPages}</span>
        <div className="flex items-center gap-2">
          <button disabled={page<=1} onClick={() => setPage(1)} className="px-2 py-1 border rounded disabled:opacity-50">«</button>
          <button disabled={page<=1} onClick={() => setPage(p=>Math.max(1,p-1))} className="px-2 py-1 border rounded disabled:opacity-50">‹</button>
          <button disabled={page>=totalPages} onClick={() => setPage(p=>Math.min(totalPages,p+1))} className="px-2 py-1 border rounded disabled:opacity-50">›</button>
          <button disabled={page>=totalPages} onClick={() => setPage(totalPages)} className="px-2 py-1 border rounded disabled:opacity-50">»</button>
        </div>
      </div>
    </div>
  );
};

export default TeachersTable;


