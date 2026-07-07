#!/bin/bash
sed -i 's/import { Student, ClassRoom/import { Student, ClassRoom, Book, BookPayment/g' src/utils/db.ts
