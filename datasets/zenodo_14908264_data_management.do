* Do-file for data management and cleaning - Sheep dataset - SCC and DSCC 

version 18
clear

*Import the dataset
import excel "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Data/Planilha ovelhas Marla (04.09.2024)_Mariana.xlsx", sheet("Total") firstrow clear


// Remove the first row
drop in 1

// Import the dataset again but do not specify 'firstrow' to avoid using the first row as variable names
import excel "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Data/Planilha ovelhas Marla (04.09.2024)_Mariana.xlsx", sheet("Total") firstrow clear

// Remove the first row
drop in 1

// Use the new first row as variable names
import excel "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Data/Planilha ovelhas Marla (04.09.2024)_Mariana.xlsx", sheet("Total") cellrange(A2) firstrow clear


// List the first few rows to verify the changes
list in 1/5

// Describe the dataset to check variable names
describe


*Deleting empty rows
drop if CCSTotal==. /*(11 observations deleted)*/

*Deleting SCC=0
drop if CCSTotal==0 /*(2 observations deleted)*/


*Renaming variables
rename (Amostra Momento Teto Categoria Isolados CMT Polimorfonucleares Logpolimorfonucleares Mononucleares Logmononucleares CCSTotal LogCCStotal Neutrófilos Eosinófilos Linfócitos Macrófagos) (sheep time quarter parity maldi cmt poli logpoli mono logmono scc1 logscc neutrophils eosi linf macrof)

*Dropping variable Total 
drop Total

*Encoding categorical variables
encode sheep, gen(sheep1)
order sheep1, before(sheep)
drop sheep
rename sheep1 sheep

encode quarter, gen(quarter1)
order quarter1, before(quarter)
drop quarter
rename quarter1 quarter

*Check the variable type
describe parity

*Create a new numeric variable
gen parity_num = .

*Replace numeric codes based on string values
replace parity_num = 0 if parity == "Primípara"
replace parity_num = 1 if parity == "Plurípara"

*Verify the new variable
tabulate parity_num

*Drop the old variable
drop parity

*Rename the new variable
rename parity_num parity
order parity, after(quarter)

*Define value labels
label define parity_labels 0 "First lactation" 1 ">= 2 lactations"

*Apply the labels to the variable
label values parity parity_labels

*SCC as x10^3
gen scc=scc1/1000
order scc, after(scc1)


*PMN and MONO x 10^3
gen poli1=poli/1000
order poli1, after(poli)
drop poli
rename poli1 poli

gen mono1=mono/1000
order mono1, after(mono)
drop mono
rename mono1 mono

*Generating lnscc mono and poli
gen lnmono=ln(scc) 
order lnmono, after(mono)

gen lnpoli=ln(poli)
order lnpoli, after(poli)

*Creating IMI variable 
gen imistatus=0 if maldi=="Negativo"
replace imistatus = 1 if maldi == "Staphylococcus aureus" | maldi == "Escherichia coli" | maldi == "Escherichia vulneris" | maldi == "Leclercia adecarboxylata" | maldi == "Serratia marcescens" | maldi == "Wautersiella falsenii"
replace imistatus=2 if maldi=="Corynebacterium bovis" 
replace imistatus=3 if maldi=="Staphylococcus chromogenes"
replace imistatus=4 if maldi=="Staphylococcus simulans"
replace imistatus=5 if maldi=="Staphylococcus xylosus"
replace imistatus = 6 if maldi == "Staphilococcus auricularis" | maldi == "Staphylococcus epidermidis" | maldi == "Staphylococcus lentus" | maldi == "Staphylococcus microti" | maldi == "Staphylococcus saprophyticus" | maldi == "Staphylococcus sciuri" | maldi == "Staphylococcus equorum" | maldi == "Staphylococcus sciuri / Staphylococcus equorum"
replace imistatus = 7 if maldi == "Bacillus spp" | maldi == "Corynebacterium casei" | maldi == "Corynebacterium stationis" | maldi == "Enterobacter cloacae" | maldi == "Enterobacter kobei" | maldi == "Enterococcus faecalis" | maldi == "Enterococcus hirae"  

label define mylabel1 0 "No growth" 1 "Major" 2 "Corynebacterium bovis" 3 "Staphylococcus chromogenes" 4 "Staphylococcus simulans" 5 "Staphylococcus xylosus" 6 "Other NASM" 7 "Other status", modify
label value imistatus mylabel1
order imistatus, after(maldi)

*Generating the variable DIM
gen dim=.
replace dim=3 if time==1 | time==2 | time==3 
replace dim=7 if time==4
replace dim=15 if time==5
replace dim=30 if time==6
order dim, after(time)

gen dim_cat = .
replace dim_cat = 1 if dim==3
replace dim_cat = 2 if dim==7
replace dim_cat = 3 if dim==15
replace dim_cat = 4 if dim==30


label define dim_cat 1 "1 to 3 DIM" 2 "7 DIM" 3 "15 DIM" 4 "30 DIM" 
label values dim_cat dim_cat
order dim_cat, after(dim)

*Generating lnscc
gen lnscc=ln(scc) 
order lnscc, after(logscc)

*Generating DSCC
gen dscc=neutrophils+linf+eosi
order dscc, after(scc)

*Generating Total cells
gen total=neutrophils+eosi+linf+macrof


* Data imputation for the other observations
foreach var of varlist macrof { 
    replace `var' = `var' + 1
}


*Generating lnmacrof
gen lnmacrof=ln(macrof)
order lnmacrof, after(macrof)


save "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Data/Data_clean", replace
