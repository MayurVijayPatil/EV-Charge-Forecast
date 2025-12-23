import { useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useUploadStats } from "@/hooks/use-stats";
import { useToast } from "@/hooks/use-toast";
import { clsx } from "clsx";

export default function DataUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: upload, isPending } = useUploadStats();
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    
    upload(formData, {
      onSuccess: (data) => {
        toast({ title: "Upload Complete", description: `Processed ${data.count} records successfully.` });
        setFile(null);
      },
      onError: (err) => {
        toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header title="Data Upload" />
        
        <div className="flex-1 p-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-display font-bold text-foreground">Import Historical Data</h2>
              <p className="text-muted-foreground mt-2">Upload CSV files containing regional EV stats to update the training model.</p>
            </div>

            <div 
              className={clsx(
                "relative border-2 border-dashed rounded-2xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center bg-card",
                dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50",
                file && "border-emerald-500/50 bg-emerald-50/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                ref={inputRef}
                type="file" 
                className="hidden" 
                accept=".csv"
                onChange={handleChange} 
              />
              
              {!file ? (
                <>
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Drag and drop CSV file</h3>
                  <p className="text-muted-foreground mb-6">or click to browse from your computer</p>
                  <button 
                    onClick={() => inputRef.current?.click()}
                    className="px-6 py-2.5 rounded-lg bg-background border border-border font-semibold shadow-sm hover:bg-muted transition-colors"
                  >
                    Select File
                  </button>
                  <div className="mt-8 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
                    <p className="font-semibold mb-1">Required Format:</p>
                    <code className="font-mono">year, region, ev_type, count, charging_demand_kwh</code>
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex items-center gap-4 p-4 bg-background border border-border rounded-xl mb-6 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-foreground truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button 
                      onClick={() => setFile(null)}
                      className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                    >
                      <AlertCircle className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleUpload}
                    disabled={isPending}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6" />
                        Confirm Upload
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
