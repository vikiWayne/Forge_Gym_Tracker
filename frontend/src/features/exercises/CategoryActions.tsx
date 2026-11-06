import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Category } from "../../shared/api/types";
import { Modal } from "../../shared/ui/Modal";
import { CategoryForm } from "./CategoryForm";
import { DeleteCategoryForm } from "./DeleteCategoryForm";
export function CategoryActions({
  category,
  onDeleted,
}: {
  category: Category;
  onDeleted: () => void;
}) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  return (
    <>
      <div className="row-actions category-actions">
        <button
          className="icon-button"
          aria-label={`Edit category: ${category.name}`}
          onClick={() => setDialog("edit")}
        >
          <Pencil size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={`Delete category: ${category.name}`}
          onClick={() => setDialog("delete")}
        >
          <Trash2 size={16} />
        </button>
      </div>
      {dialog && (
        <Modal
          title={
            dialog === "edit"
              ? "Edit training category"
              : "Delete training category?"
          }
          close={() => setDialog(null)}
        >
          {dialog === "edit" ? (
            <CategoryForm category={category} onSaved={() => setDialog(null)} />
          ) : (
            <DeleteCategoryForm
              category={category}
              onCancel={() => setDialog(null)}
              onSaved={() => {
                setDialog(null);
                onDeleted();
              }}
            />
          )}
        </Modal>
      )}
    </>
  );
}
