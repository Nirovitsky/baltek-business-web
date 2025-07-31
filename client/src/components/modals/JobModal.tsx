import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import JobForm from "../jobs/JobForm";
import type { Job } from "@shared/schema";

interface JobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job;
  onSuccess?: () => void;
}

export default function JobModal({ open, onOpenChange, job, onSuccess }: JobModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {job ? 'Edit Job Posting' : 'Create New Job Posting'}
          </DialogTitle>
        </DialogHeader>
        <JobForm 
          job={job} 
          onSuccess={() => {
            onSuccess?.();
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}